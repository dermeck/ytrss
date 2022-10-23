import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { FolderSimple, CaretDown, CaretRight } from 'phosphor-react';

import React, { Fragment, useContext, useState } from 'react';
import { useDispatch } from 'react-redux';

import { InsertMode, NodeMeta, NodeType } from '../../model/feeds';
import { useAppSelector } from '../../store/hooks';
import feedsSlice, { selectDescendentNodeIds, selectHasVisibleChildren } from '../../store/slices/feeds';
import { UnreachableCaseError } from '../../utils/UnreachableCaseError';
import { RelativeDragDropPosition, relativeDragDropPosition } from '../../utils/dragdrop';
import { DragDropContext } from './contexts';

interface FolderTitleContainerProps {
    selected: boolean;
    focus: boolean;
    disabled?: boolean;
    nestedLevel: number;
}

const FolderTitleContainer = styled.div<FolderTitleContainerProps>`
    display: flex;
    flex-direction: column;
    padding-left: ${(props) => (props.nestedLevel > 0 ? `${8 + props.nestedLevel * 15}px` : '8px')};
    margin-top: -${(props) => props.theme.spacerHeight}px;
    margin-bottom: -${(props) => props.theme.spacerHeight}px;

    background-color: ${(props) =>
        props.selected
            ? props.focus
                ? props.theme.colors.selectedItemBackgroundColor
                : props.theme.colors.selectedItemNoFocusBackgroundColor
            : 'inherit'};
    color: ${(props) =>
        props.selected
            ? props.focus
                ? props.theme.colors.selectedItemTextColor
                : props.theme.colors.selectedItemNoFocusTextColor
            : 'inherit'};
    opacity: ${(props) => (props.disabled ? 0.3 : 0.9)};
`;

interface SpacerProps {
    highlight: boolean;
}

const Spacer = styled.div<SpacerProps>`
    width: 48px;
    height: ${(props) => props.theme.spacerHeight}px;
    margin-left: ${({ theme }) => theme.toggleIndicatorSize + theme.iconRightSpacing}px;

    background-color: ${(props) => (props.highlight ? props.theme.colors.selectedItemBackgroundColor : 'inherit')};
`;

const FolderTitleRow = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-top: 1px;
    padding-right: 0;
    padding-bottom: 1px;
`;

const FolderTitle = styled.label<{ highlight: boolean }>`
    overflow: hidden;
    background-color: ${(props) => (props.highlight ? props.theme.colors.selectedItemBackgroundColor : 'inherit')};
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const ToggleIndicator = styled.div`
    width: ${({ theme }) => theme.toggleIndicatorSize}px;
    padding-right: ${({ theme }) => theme.iconRightSpacing}px;
    margin-bottom: -6px;
`;

const FolderIcon = styled(FolderSimple)`
    flex-shrink: 0;
    margin-top: -2px; /* align with label */
    margin-right: ${({ theme }) => theme.iconRightSpacing}px;
`;

interface Props {
    nodeMeta: NodeMeta;
    title: string;
    showTitle: boolean;
    nestedLevel: number;
    children: React.ReactNode;
    selected: boolean;
    focus: boolean;
    expanded: boolean;
    onClick: () => void;
    onBlur: () => void;
    onContextMenu: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    disabled: boolean;
}

const Folder = (props: Props) => {
    const theme = useTheme();
    const dispatch = useDispatch();

    // only use this for UI rendering effects (insert/before/after indicator)
    const [relativeDropPosition, setRelativDropPosition] = useState<RelativeDragDropPosition | undefined>(undefined);

    const showToggleIndicator = useAppSelector((state) => selectHasVisibleChildren(state.feeds, props.nodeMeta));

    // only use this for UI rendering effects (insert/before/after indicator, disabled)
    // TODO is this comment still relevant with dragged node in context?
    const { draggedNode, setDraggedNode } = useContext(DragDropContext);
    const descendentNodeIds = useAppSelector((state) => selectDescendentNodeIds(state.feeds, props.nodeMeta.nodeId));

    if (!props.showTitle) {
        return <Fragment>{props.children}</Fragment>;
    }

    const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        event.dataTransfer.setData('invalidDroptTargets', descendentNodeIds.join(';'));
        event.dataTransfer.setData('draggedNodeMeta', JSON.stringify(props.nodeMeta));

        if (draggedNode?.nodeId !== props.nodeMeta.nodeId) {
            setDraggedNode(props.nodeMeta);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        if (event.dataTransfer.getData('draggedNodeMeta') === '') {
            // if drag over happens very fast this might not be set properly
            return;
        }

        const invalidDroptTargets = event.dataTransfer.getData('invalidDroptTargets').split(';');

        if (invalidDroptTargets.find((x) => x === props.nodeMeta.nodeId)) {
            return;
        }

        const dragged: NodeMeta = JSON.parse(event.dataTransfer.getData('draggedNodeMeta'));

        if (!props.disabled) {
            setRelativDropPosition(calculateRelativeDragDropPosition(dragged.nodeType, props.nodeMeta.nodeType, event));

            event.preventDefault();
        }
    };

    const handleDragLeave = () => {
        if (relativeDropPosition !== undefined) {
            setRelativDropPosition(undefined);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        const invalidDroptTargets = event.dataTransfer.getData('invalidDroptTargets').split(';');

        if (invalidDroptTargets.find((x) => x === props.nodeMeta.nodeId)) {
            return;
        }

        const dragged: NodeMeta = JSON.parse(event.dataTransfer.getData('draggedNodeMeta'));

        // recalculate here, don't rely on local state set in handleDragover
        // handleDragover is dependend on props.disabled which depends on global store so there can be timing issues
        // (local) relativeDropPosition can be undefined if drag/drop happens very fast
        // TODO check if this is still a problem with dragged node in context!
        const relativeDropPosition = calculateRelativeDragDropPosition(
            dragged.nodeType,
            props.nodeMeta.nodeType,
            event,
        );

        if (relativeDropPosition === undefined) {
            throw new Error('Illegal state: relativeDropPosition must be definend when handleDrop is called.');
        }

        doDrop(event, relativeDropPosition);

        setRelativDropPosition(undefined);
    };

    const doDrop = (event: React.DragEvent<HTMLDivElement>, relativeDropPosition: RelativeDragDropPosition) => {
        const draggedNodeMeta: NodeMeta = JSON.parse(event.dataTransfer.getData('draggedNodeMeta'));

        if (!draggedNodeMeta) {
            // TODO can this actually happen?
            throw new Error('dragged node must be defined.');
        }

        dispatch(
            feedsSlice.actions.moveNode({
                movedNode: draggedNodeMeta,
                targetNodeId: props.nodeMeta.nodeId,
                mode:
                    props.nodeMeta.nodeType === NodeType.Folder && draggedNodeMeta.nodeType === NodeType.Feed
                        ? InsertMode.Into
                        : insertModeByRelativeDropPosition(relativeDropPosition),
            }),
        );

        setDraggedNode(undefined);
    };

    const insertModeByRelativeDropPosition = (relativeDropPosition: RelativeDragDropPosition): InsertMode => {
        switch (relativeDropPosition) {
            case RelativeDragDropPosition.Top:
                return InsertMode.Before;

            case RelativeDragDropPosition.Middle:
                return InsertMode.Into;

            case RelativeDragDropPosition.Bottom:
                return InsertMode.After;

            default:
                throw new UnreachableCaseError(relativeDropPosition);
        }
    };

    const calculateRelativeDragDropPosition = (
        draggedNodeType: NodeType,
        targetNodeType: NodeType,
        event: React.DragEvent<HTMLDivElement>,
    ) => {
        let value = undefined;
        if (draggedNodeType === NodeType.Feed && targetNodeType === NodeType.Folder) {
            // feeds can only be inserted into folders
            value = RelativeDragDropPosition.Middle;
        } else if (draggedNodeType === NodeType.Feed && targetNodeType === NodeType.Feed) {
            // feeds can only be sorted
            value = relativeDragDropPosition(event, 0.5);
        } else if (draggedNodeType === NodeType.Folder && targetNodeType === NodeType.Folder) {
            value = relativeDragDropPosition(event, 0.15);
        } else {
            throw new Error(`${draggedNodeType} can not be dropped on ${targetNodeType}.`);
        }
        return value;
    };

    const handleDragEnd = () => {
        setDraggedNode(undefined);
    };

    // TODO indicate if folder has unread items
    return (
        <Fragment>
            <FolderTitleContainer
                theme={theme}
                disabled={props.disabled}
                focus={props.focus}
                nestedLevel={props.nestedLevel}
                selected={props.selected}
                draggable={true}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                tabIndex={0}
                onClick={props.onClick}
                onBlur={props.onBlur}
                onContextMenu={props.onContextMenu}>
                <Spacer theme={theme} highlight={relativeDropPosition === RelativeDragDropPosition.Top} />
                <FolderTitleRow>
                    <ToggleIndicator theme={theme}>
                        {showToggleIndicator &&
                            (props.expanded ? (
                                <CaretDown size={theme.toggleIndicatorSize} weight="bold" />
                            ) : (
                                <CaretRight size={theme.toggleIndicatorSize} weight="bold" />
                            ))}
                    </ToggleIndicator>
                    <FolderIcon theme={theme} size={theme.folderIconSize} weight="light" />
                    <FolderTitle highlight={relativeDropPosition === RelativeDragDropPosition.Middle}>
                        {props.title}
                    </FolderTitle>
                </FolderTitleRow>
                <Spacer theme={theme} highlight={relativeDropPosition === RelativeDragDropPosition.Bottom} />
            </FolderTitleContainer>

            {props.expanded && props.children}
        </Fragment>
    );
};

if (process.env.MODE === 'dev') {
    Folder.whyDidYouRender = true;
}

export default Folder;
